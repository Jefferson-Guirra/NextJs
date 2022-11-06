import { getSession } from 'next-auth/react'
import { FiPlus, FiCalendar, FiEdit2, FiTrash, FiClock } from 'react-icons/fi'
import { GetServerSideProps } from 'next'
import Link from 'next/link'
import * as C from './styles'
import Head from 'next/head'
import { SupportButton } from '../../components/SupportButton'
import {
  doc,
  setDoc,
  where,
  query,
  orderBy,
  collection,
  addDoc,
  getDocs
} from 'firebase/firestore' 
import {format} from 'date-fns'
import { db } from '../../services/firebaseConnection'
import React, { useState,FormEvent,useEffect } from 'react'
type User = {
  name: string
  email: string
  image: string
}
type Login = {
  user: User
  expires: string
  id: string
}

type Data = {
  id: string
  created: string |  Date
  createdFormat ?: string
  tarefa: string
  userId: string
  nome: string
}

type Props = {
  userLogin: {
    nome: string
    id: string
  },
  list:string
}

const Board = ({ userLogin,list }: Props) => {
  const [input,setInput] = useState('')
  const[error,setError] = useState('')
  const [taskList,setTaskList] = useState<Data[] | []>([])

  useEffect(()=>{
    let newList: Data[] = JSON.parse(list)
    newList = newList.map(item => {
      item.createdFormat = format(new Date(), 'dd MMMM yyyy')
      return item
    })
    if(newList.length){
    setTaskList(newList)
    }
    /*let newList:Data[] = JSON.parse(list)
      newList = newList.map(item=>{
        item.createdFormat = format(new Date(), 'dd MMMM yyyy')
        return item
      }).filter(item=>item.userId === userLogin.id)
    console.log(newList)
    if(newList.length){
      setTaskList(newList)
    }*/
  },[])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    console.log(e.target.value)
    if(error){
      validate(e.target.value)
    }
    else if(e.target.value === ''){
      validate(e.target.value)
    }
  }
  const handleSubmit = async (e:FormEvent)=>{
    e.preventDefault()
    validate(input)
    if(input === ''){
      setError('Preencha com alguma tarefa')
      return
    }

    try {
      const docRef = await addDoc(collection(db, 'tarefas'), {
        created: new Date(),
        tarefa:input,
        userId:userLogin.id,
        nome:userLogin.nome
      })

      let data = {
        id:docRef.id,
        created: new Date(),
        createdFormat:format(new Date(),'dd MMMM yyyy'),
        tarefa:input,
        userId : userLogin.id,
        nome:userLogin.nome
      }
      setTaskList([...taskList,data])
      setInput('')
      console.log('Cadastrado com sucesso', docRef.id)
    } catch (e) {
      console.log('error ao cadastrar ', e)
    }

    
  }
  const validate = (value:string)=>{
    if(value.length === 0){
      setError('preencha com alguma tarefa')
    }
    else{
      setError('')
    }
  }
  return (
    <>
      <Head>
        <title>Minhas Tarefas</title>
      </Head>
      <C.container error={error} value={input}>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="digite sua tarefa..."
            value={input}
            onBlur={() => validate(input)}
            onChange={handleChange}
          />
          <button type="submit">
            <FiPlus size={25} color="#17181f" />
          </button>
        </form>
        {error && <p className="error">{error}</p>}
        <h1>Você tem {taskList.length} {taskList.length > 1 ? 'Tarefas': 'Tarefa'}</h1>
        <section>
          {taskList.map(task => (
            <C.taskList key={task.id}>
              <Link href={`board/${task.id}`}>
                <p>{task.tarefa}</p>
              </Link>
              <C.actions>
                <div>
                  <div>
                    <FiCalendar size={20} color="#FFB800" />
                    <time>{task.createdFormat}</time>
                  </div>
                </div>

                <button>
                  <FiEdit2 size={20} color="#FFF" />
                  <span>editar</span>
                </button>

                <button>
                  <FiTrash size={20} color="#FF3636" />
                  <span>Excluir</span>
                </button>
              </C.actions>
            </C.taskList>
          ))}
        </section>
      </C.container>
      <C.vipContainer>
        <h3>Obrigado por apoiar esse projeto</h3>
        <div>
          <FiClock size={28} color="#FFF" />
          <time>Última doação foi a 3 dias.</time>
        </div>
      </C.vipContainer>
      <SupportButton />
    </>
  )
}

export default Board

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = (await getSession({ req })) as Login | null
  if (!session?.user?.name) {
    return {
      redirect: {
        destination: '/',
        permanent: false
      }
    }
  }


  /* Obtendo uma coleção sem ordenar os dados
  await getDocs(collection(db, 'tarefas')).then(querySnapshot => {
    const newData = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }))
  })*/

  const ref = collection(db, 'tarefas')
  let list = JSON.stringify(
    await getDocs(
      query(ref, where('userId', '==', session.id), orderBy('created', 'asc'))
    ).then(querySnapshot => {
      const newData = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }))
      return newData
    })
  )

  const data = JSON.stringify(list)
  

  const userLogin = {
    nome: session.user.name,
    id: session.id
  }

  return {
    props: {
      userLogin,
      list
    }
  }
}
